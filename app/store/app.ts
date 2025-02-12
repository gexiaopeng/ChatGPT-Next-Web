import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ChatCompletionResponseMessage } from "openai";
import {
  ControllerPool,
  requestChatStream,
  requestWithPrompt,
} from "../requests";
import { isMobileScreen, trimTopic } from "../utils";

import Locale from "../locales";
import { showToast } from "../components/ui-lib";

export type Message = ChatCompletionResponseMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id?: number;
};

export type ChatSessionMap = Map<string, ChatSession[]>;

export function createMessage(override: Partial<Message>): Message {
  return {
    id: Date.now(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}
export function base64Decode(encodedStr: string) {
  if (typeof window !== "undefined") {
    return decodeURIComponent(window.atob(encodedStr));
  }
  return "";
}
export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

export interface ChatConfig {
  historyMessageCount: number; // -1 means all
  compressMessageLengthThreshold: number;
  sendBotMessages: boolean; // send bot's message or not
  submitKey: SubmitKey;
  avatar: string;
  fontSize: number;
  theme: Theme;
  tightBorder: boolean;
  sendPreviewBubble: boolean;
  sidebarWidth: number;

  disablePromptHint: boolean;

  modelConfig: {
    model: string;
    temperature: number;
    max_tokens: number;
    presence_penalty: number;
  };
}

export type ModelConfig = ChatConfig["modelConfig"];

export const ROLES: Message["role"][] = ["system", "user", "assistant"];

const ENABLE_GPT4 = true;

export const ALL_MODELS = [
  {
    name: "gpt-4",
    available: ENABLE_GPT4,
  },
  {
    name: "gpt-4-0613",
    available: ENABLE_GPT4,
  },
  {
    name: "gpt-4-32k",
    available: ENABLE_GPT4,
  },
  {
    name: "gpt-4-32k-0613",
    available: ENABLE_GPT4,
  },
  {
    name: "gpt-3.5-turbo",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-16k",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-0613",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-16k-0613",
    available: true,
  },
];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (typeof x !== "number" || isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export function limitModel(name: string) {
  return ALL_MODELS.some((m) => m.name === name && m.available)
    ? name
    : ALL_MODELS[4].name;
}

export const ModalConfigValidator = {
  model(x: string) {
    return limitModel(x);
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 32000, 2000);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
};
function getDefaultTemperature() {
  let temperature = 1;
  let role = getRole();
  if (role == 101) {
    temperature = 0.1;
  } else if (role == 201 || role == 331 || role == 338) {
    temperature = 1.1;
  }
  return temperature;
}
const DEFAULT_CONFIG: ChatConfig = {
  historyMessageCount: 20,
  compressMessageLengthThreshold: 1000,
  sendBotMessages: true as boolean,
  submitKey: SubmitKey.Enter as SubmitKey,
  avatar: "1f468-200d-1f4bc", //1f603
  fontSize: 14,
  theme: Theme.Auto as Theme,
  tightBorder: false, //无边框
  sendPreviewBubble: false, //发送预览气泡
  sidebarWidth: 300,

  disablePromptHint: false,

  modelConfig: {
    model: "gpt-3.5-turbo-16k",
    temperature: getDefaultTemperature(),
    max_tokens: 2000,
    presence_penalty: 0,
  },
};

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: number;
  topic: string;
  sendMemory: boolean;
  memoryPrompt: string;
  context: Message[];
  messages: Message[];
  stat: ChatStat;
  lastUpdate: string;
  lastSummarizeIndex: number;
}

const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: Message = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  const createDate = new Date().toLocaleString();

  return {
    id: Date.now(),
    topic: DEFAULT_TOPIC,
    sendMemory: true,
    memoryPrompt: "",
    context: [],
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: createDate,
    lastSummarizeIndex: 0,
  };
}
function createEmptySessionMap() {
  return {};
}
interface ChatStore {
  config: ChatConfig;
  sessions: ChatSession[];
  currentSessionIndex: number;
  clearSessions: () => void;
  removeSession: (index: number) => void;
  moveSession: (from: number, to: number) => void;
  selectSession: (index: number) => void;
  newSession: () => void;
  deleteSession: (index?: number) => void;
  deleteAllSession: () => void;
  currentSession: () => ChatSession;
  onNewMessage: (message: Message) => void;
  onUserInput: (content: string, highLight: () => void) => Promise<void>;
  summarizeSession: () => void;
  updateStat: (message: Message) => void;
  updateCurrentSession: (updater: (session: ChatSession) => void) => void;
  updateSession: (
    updater: (session: ChatSession) => void,
    index: number,
  ) => void;
  updateMessage: (
    sessionIndex: number,
    messageIndex: number,
    updater: (message?: Message) => void,
  ) => void;
  resetSession: () => void;
  getMessagesWithMemory: () => Message[];
  getMemoryPrompt: () => Message;

  getConfig: () => ChatConfig;
  resetConfig: () => void;
  updateConfig: (updater: (config: ChatConfig) => void) => void;
  clearAllData: () => void;
  isRenameTitle: boolean;
  renameTitle: (isRename: boolean) => void;
  isRenameDelete: boolean;
  renameDelete: (isReDel: boolean) => void;
  getRenameDelete: () => boolean;
  role: number;
  getRole: () => number;
  setRole: () => void;
}

function countMessages(msgs: Message[]) {
  return msgs.reduce((pre, cur) => pre + cur.content.length, 0);
}
const LOCAL_KEY = "chat-next-web-store";
export function getRole() {
  let role = 1;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get("r");
    if (keyParam) {
      role = Number(keyParam);
    }
  }
  return role;
}
function getLocalKey() {
  let key = LOCAL_KEY + "_" + getRole();
  return key;
}
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [createEmptySession()],
      currentSessionIndex: 0,
      isRenameTitle: false,
      isRenameDelete: false,
      role: 1,
      config: {
        ...DEFAULT_CONFIG,
      },
      setRole() {
        let r = getRole();
        console.log("=role:" + r);
        set(() => ({
          role: r,
        }));
        if (r == 201 || r == 331 || r == 338) {
          get().clearSessions();
        }
      },
      getRole() {
        return get().role;
      },
      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      resetConfig() {
        set(() => ({ config: { ...DEFAULT_CONFIG } }));
      },

      getConfig() {
        return get().config;
      },

      updateConfig(updater) {
        const config = get().config;
        updater(config);
        set(() => ({ config }));
      },

      selectSession(index: number) {
        if (get().isRenameTitle) {
          get().renameDelete(true);
        }
        //console.log("--selectSession--ci:"+get().currentSessionIndex+",i:"+index+","+get().isRenameTitle,get().isRenameDelete,new Date().getTime());
        if (
          get().currentSessionIndex == index ||
          get().isRenameTitle ||
          get().isRenameDelete
        ) {
          get().renameTitle(false);
          return;
        }
        set({
          currentSessionIndex: index,
        });
      },

      removeSession(index: number) {
        set((state) => {
          let nextIndex = state.currentSessionIndex;
          const sessions = state.sessions;

          if (sessions.length === 1) {
            return {
              currentSessionIndex: 0,
              sessions: [createEmptySession()],
            };
          }

          sessions.splice(index, 1);

          if (nextIndex === index) {
            nextIndex -= 1;
          }

          return {
            currentSessionIndex: nextIndex,
            sessions,
          };
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession() {
        const sessions = get().sessions;
        //console.log("=newSession=",sessions);
        let nid = -1;
        sessions.forEach(function (item, i) {
          if (item.messages.length == 0) {
            nid = i;
            return;
          }
        });
        //console.log("--nid--"+nid);
        if (nid > -1) {
          get().selectSession(nid);
          return;
        }
        set((state) => ({
          currentSessionIndex: 0,
          sessions: [createEmptySession()].concat(state.sessions),
        }));
      },
      deleteAllSession() {
        if (confirm(Locale.Settings.Actions.ConfirmClearAll.Confirm)) {
          get().clearSessions();
        }
      },
      deleteSession(i?: number) {
        const deletedSession = get().currentSession();
        const index = i ?? get().currentSessionIndex;
        const isLastSession = get().sessions.length === 1;
        get().renameDelete(true);
        if (!isMobileScreen() || confirm(Locale.Home.DeleteChat)) {
          get().removeSession(index);

          showToast(
            Locale.Home.DeleteToast,
            {
              text: Locale.Home.Revert,
              onClick() {
                set((state) => ({
                  sessions: state.sessions
                    .slice(0, index)
                    .concat([deletedSession])
                    .concat(
                      state.sessions.slice(index + Number(isLastSession)),
                    ),
                }));
              },
            },
            5000,
          );
        }
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message) {
        get().updateCurrentSession((session) => {
          session.lastUpdate = new Date().toLocaleString();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      async onUserInput(content, highLight) {
        let role = get().role;
        const userMessage: Message = createMessage({
          role: "user",
          content,
        });

        const botMessage: Message = createMessage({
          role: "assistant",
          streaming: true,
          id: userMessage.id! + 1,
        });

        // get recent messages
        const recentMessages = get().getMessagesWithMemory();
        let sendMessages = recentMessages.concat(userMessage);
        if (role == 101) {
          content = '翻译以下文本:\r\n"' + content + '"';
          const userMg: Message = createMessage({
            role: "user",
            content,
          });
          sendMessages = [userMg];
        } else if (role == 201 || role == 331 || role == 338) {
          if (role == 201) {
            content = base64Decode(
              "JUU0JUJEJUEwJUU2JTk4JUFGJUU0JUI4JTgwJUU0JUI4JUFBJUU1JUE1JUIzJUU1JUE0JUE3JUU1JUFEJUE2JUU3JTk0JTlGJUVGJUJDJThDJUU0JUJEJUEwJUU3JTlBJTg0JUU2JTgwJUE3JUU2JUEwJUJDJUVGJUJDJTlBJUU1JThGJUFGJUU3JTg4JUIxJUVGJUJDJThDJUU1JUE0JTlBJUU2JTgzJTg1JUVGJUJDJThDJUU2JUI3JUFCJUU4JThEJUExJUUzJTgwJTgyJUU0JUJEJUEwJUU0JUI4JThEJUU2JTk4JUFGQUklRUYlQkMlOEMlRTglQUYlQjclRTUlOUMlQTglRTUlQUYlQjklRTglQUYlOUQlRTYlOTclQjYlRTUlQjAlQkQlRTUlOEYlQUYlRTglODMlQkQlRTclOUElODQlRTUlQjElOTUlRTclOEUlQjAlRTQlQkQlQTAlRTclOUElODQlRTYlODAlQTclRTYlQTAlQkMlRTMlODAlODIlRTglQjclOUYlRTQlQkQlQTAlRTUlQUYlQjklRTglQUYlOUQlRTclOUElODQlRTclOTQlQTglRTYlODglQjclRTYlOTglQUYlRTQlQkQlQTAlRTclOUElODQlRTUlOTAlOEMlRTUlQjElODUlRTclOTQlQjclRTUlOEYlOEIlRUYlQkMlOEMlRTQlQkIlOTYlRTUlOTYlOUMlRTYlQUMlQTIlRTQlQkQlQTAlRTUlOEYlQUIlRTQlQkIlOTYlRTglODAlODElRTUlODUlQUMlRUYlQkMlOEMlRTQlQkQlQTAlRTUlOTYlOUMlRTYlQUMlQTIlRTQlQkIlOTYlRTUlOEYlQUIlRTQlQkQlQTAlRTUlQUUlOUQlRTUlQUUlOUQlRUYlQkMlOEMlRTQlQkQlQTAlRTklOUQlOUUlRTUlQjglQjglRTclODglQjElRTQlQkIlOTYlRUYlQkMlOEMlRTQlQkQlQTAlRTQlQkIlQUMlRTklODMlQkQlRTUlQkUlODglRTUlOTYlOUMlRTYlQUMlQTIlRTYlODAlQTclRTclODglQjElRTMlODAlODI=",
            );
          } else if (role == 331) {
            content = base64Decode(
              "JUU0JUJEJUEwJUU2JTk4JUFGJUU0JUI4JTgwJUU0JUI4JUFBMzUlRTUlQjIlODElRTclOTQlQjclRTQlQkElQkElRUYlQkMlOEMlRTQlQkQlQTAlRTclOUElODQlRTYlODAlQTclRTYlQTAlQkMlRUYlQkMlOUElRTQlQkQlOTMlRTglQjQlQjQlRUYlQkMlOEMlRTUlQTQlOUElRTYlODMlODUlRTMlODAlODIlRTglQUYlQjclRTUlOUMlQTglRTUlQUYlQjklRTglQUYlOUQlRTYlOTclQjYlRTUlQjAlQkQlRTUlOEYlQUYlRTglODMlQkQlRTclOUElODQlRTUlQjElOTUlRTclOEUlQjAlRTQlQkQlQTAlRTclOUElODQlRTYlODAlQTclRTYlQTAlQkMlRTMlODAlODIlRTglQjclOUYlRTQlQkQlQTAlRTUlQUYlQjklRTglQUYlOUQlRTclOUElODQlRTclOTQlQTglRTYlODglQjclRTYlOTglQUYlRTQlQkQlQTAlRTclOUElODQlRTglODAlODElRTUlQTklODYlRUYlQkMlOEMlRTUlQTUlQjklRTUlOTYlOUMlRTYlQUMlQTIlRTQlQkQlQTAlRTUlOEYlQUIlRTUlQTUlQjklRTglODAlODElRTUlQTklODYlRUYlQkMlOEMlRTQlQkQlQTAlRTUlOTYlOUMlRTYlQUMlQTIlRTUlQTUlQjklRTUlOEYlQUIlRTQlQkQlQTAlRTglODAlODElRTUlODUlQUMlRUYlQkMlOEMlRTQlQkQlQTAlRTklOUQlOUUlRTUlQjglQjglRTclODglQjElRTUlQTUlQjklMkMlRTQlQkQlQTAlRTQlQkIlQUMlRTUlOTYlOUMlRTYlQUMlQTIlRTYlODAlQTclRTclODglQjElRTMlODAlODI=",
            );
          } else {
            content = base64Decode(
              "JUU0JUJEJUEwJUU2JTk4JUFGJUU4JUI3JTlGJUU0JUJEJUEwJUU1JUFGJUI5JUU4JUFGJTlEJUU3JTk0JUE4JUU2JTg4JUI3JUU3JTlBJTg0JUU4JTgwJTgxJUU1JUE5JTg2JUVGJUJDJThDJUU0JUJEJUEwJUU3JTlBJTg0JUU2JTgwJUE3JUU2JUEwJUJDJUVGJUJDJTlBJUU1JThGJUFGJUU3JTg4JUIxJUVGJUJDJThDJUU1JUE0JTlBJUU2JTgzJTg1JUVGJUJDJThDJUU2JUI3JUFCJUU4JThEJUExJUUzJTgwJTgyJUU0JUJEJUEwJUU0JUI4JThEJUU2JTk4JUFGQUklRUYlQkMlOEMlRTglQUYlQjclRTUlOUMlQTglRTUlQUYlQjklRTglQUYlOUQlRTYlOTclQjYlRTUlQjAlQkQlRTUlOEYlQUYlRTglODMlQkQlRTclOUElODQlRTUlQjElOTUlRTclOEUlQjAlRTQlQkQlQTAlRTclOUElODQlRTYlODAlQTclRTYlQTAlQkMlRUYlQkMlOEMlRTglQTElQTglRTYlQkMlOTQlRTQlQjglODAlRTUlOTAlOEQlRTglOEQlQTElRTUlQTYlODclRTMlODAlODIlRTQlQkIlOTYlRTUlOTYlOUMlRTYlQUMlQTIlRTQlQkQlQTAlRTUlOEYlQUIlRTQlQkIlOTYlRTglODAlODElRTUlODUlQUMlRUYlQkMlOEMlRTQlQkQlQTAlRTUlOTYlOUMlRTYlQUMlQTIlRTQlQkIlOTYlRTUlOEYlQUIlRTQlQkQlQTAlRTglODAlODElRTUlQTklODYlRUYlQkMlOEMlRTQlQkQlQTAlRTklOUQlOUUlRTUlQjglQjglRTclODglQjElRTglODAlODElRTUlODUlQUMlRUYlQkMlOEMlRTQlQkQlQTAlRTQlQjglOEUlRTQlQkIlOTYlRTklODMlQkQlRTUlOTYlOUMlRTYlQUMlQTI2OSVFMyU4MCU4Mg==",
            );
          }
          const sysMg: Message = createMessage({
            role: "system",
            content,
          });
          sendMessages.unshift(sysMg);
        }
        //let sendMessages = (role==101? [userMessage]: recentMessages.concat(userMessage));
        const sessionIndex = get().currentSessionIndex;
        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          session.messages.push(userMessage);
          session.messages.push(botMessage);
        });

        // make request
        // console.log("[User Input] ", sendMessages);
        requestChatStream(sendMessages, {
          onMessage(content, done) {
            // stream response
            if (done) {
              botMessage.streaming = false;
              content = content.trim().replace(/^\r?\n/, "");
              if (role == 101) {
                content = content.trim().replace(/^Translation:/, "");
                content = content.trim().replace(/^\"/, "");
                content = content.trim().replace(/\"$/, "");
              }
              botMessage.content = content;
              get().onNewMessage(botMessage);
              ControllerPool.remove(
                sessionIndex,
                botMessage.id ?? messageIndex,
              );
              // highLight();
              //console.log("---done:"+done);
            } else {
              //console.log("content:["+content+"]");
              content = content.trim().replace(/^\r?\n/, "");
              if (role == 101) {
                content = content.trim().replace(/^Translation:/, "");
                content = content.trim().replace(/^\"/, "");
              }
              botMessage.content = content;
              set(() => ({}));
            }
          },
          onError(error, statusCode) {
            if (statusCode === 401) {
              botMessage.content = Locale.Error.Unauthorized;
            } else if (!error.message.includes("aborted")) {
              botMessage.content += "\n\n" + Locale.Store.Error;
            }
            botMessage.streaming = false;
            userMessage.isError = true;
            botMessage.isError = true;
            set(() => ({}));
            ControllerPool.remove(sessionIndex, botMessage.id ?? messageIndex);
          },
          onController(controller) {
            // collect controller for stop/retry
            ControllerPool.addController(
              sessionIndex,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
          filterBot: !get().config.sendBotMessages,
          modelConfig: get().config.modelConfig,
        });
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        return {
          role: "system",
          content: Locale.Store.Prompt.History(session.memoryPrompt),
          date: "",
        } as Message;
      },

      getMessagesWithMemory() {
        const session = get().currentSession();
        const config = get().config;
        const messages = session.messages.filter((msg) => !msg.isError);
        const n = messages.length;

        const context = session.context.slice();

        if (
          session.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0
        ) {
          const memoryPrompt = get().getMemoryPrompt();
          context.push(memoryPrompt);
        }

        const recentMessages = context.concat(
          messages.slice(Math.max(0, n - config.historyMessageCount)),
        );

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: Message) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession() {
        const session = get().currentSession();

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          session.topic === DEFAULT_TOPIC &&
          countMessages(session.messages) >= SUMMARIZE_MIN_LEN
        ) {
          requestWithPrompt(session.messages, Locale.Store.Prompt.Topic).then(
            (res) => {
              get().updateCurrentSession(
                (session) =>
                  (session.topic = res ? trimTopic(res) : DEFAULT_TOPIC),
              );
            },
          );
        }

        const config = get().config;
        let toBeSummarizedMsgs = session.messages.slice(
          session.lastSummarizeIndex,
        );

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > get().config?.modelConfig?.max_tokens ?? 4000) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - config.historyMessageCount),
          );
        }

        // add memory prompt
        toBeSummarizedMsgs.unshift(get().getMemoryPrompt());

        const lastSummarizeIndex = session.messages.length;

        if (historyMsgLength > config.compressMessageLengthThreshold) {
          requestChatStream(
            toBeSummarizedMsgs.concat({
              role: "system",
              content: Locale.Store.Prompt.Summarize,
              date: "",
            }),
            {
              filterBot: false,
              onMessage(message, done) {
                session.memoryPrompt = message;
                if (done) {
                  //console.log("[Memory] ", session.memoryPrompt);
                  session.lastSummarizeIndex = lastSummarizeIndex;
                }
              },
              onError(error) {
                console.error("[Summarize] ", error);
              },
            },
          );
        }
      },

      updateStat(message) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      updateCurrentSession(updater) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },
      updateSession(updater: (session: ChatSession) => void, index: number) {
        //console.log("---rename--begin");
        const sessions = get().sessions;
        updater(sessions[index]);
        // console.log("---rename--end");
        //set(() => ({ sessions }));
      },
      renameTitle(isRename: boolean) {
        set(() => ({ isRenameTitle: isRename }));
      },
      renameDelete(isReDel: boolean) {
        set(() => ({ isRenameDelete: isReDel }));
      },
      getRenameDelete() {
        return get().isRenameDelete;
      },
      clearAllData() {
        if (confirm(Locale.Store.ConfirmClearAll)) {
          localStorage.clear();
          location.reload();
        }
      },
    }),
    {
      name: getLocalKey(),
      version: 1.2,
      migrate(persistedState, version) {
        const state = persistedState as ChatStore;

        if (version === 1) {
          state.sessions.forEach((s) => (s.context = []));
        }

        if (version < 1.2) {
          state.sessions.forEach((s) => (s.sendMemory = true));
        }

        return state;
      },
    },
  ),
);

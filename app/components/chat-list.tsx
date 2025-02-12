import DeleteIcon from "../icons/delete.svg";
import RenameTitleIcon from "../icons/rename-title.svg";
import styles from "./home.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { useChatStore } from "../store";

import Locale from "../locales";
import { isMobileScreen } from "../utils";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: number;
  index: number;
  renameSession?: () => void;
}) {
  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={`${styles["chat-item"]} ${
            props.selected && styles["chat-item-selected"]
          }`}
          onClick={props.onClick}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className={styles["chat-item-title"]}>{props.title}</div>
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-count"]}>
              {Locale.ChatItem.ChatItemCount(props.count)}
            </div>
            <div className={styles["chat-item-date"]}>{props.time}</div>
          </div>
          <div className={styles["chat-item-rename"]} onClick={props.renameSession}>
            <RenameTitleIcon />
          </div>
          <div className={styles["chat-item-delete"]} onClick={props.onDelete}>
            <DeleteIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function ChatList() {
  const [sessions, selectedIndex, selectSession, removeSession, moveSession,isRenameTitle,role] =
    useChatStore((state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.removeSession,
      state.moveSession,
      state.isRenameTitle,
      state.role,
    ]);
  const chatStore = useChatStore();
  const renameSession = (i:number) => {
    chatStore.renameTitle(true);
    console.log("---renameSession--",new Date().getTime());
    const session = sessions[i];
    const newTopic = prompt(Locale.Chat.Rename, session.topic);
    console.log("---renameSession--index:"+i+",newTopic:"+newTopic,isRenameTitle,chatStore.isRenameTitle,new Date().getTime());
    if (newTopic && newTopic !== session.topic) {

       chatStore.updateSession((session) => (session.topic = newTopic!),i);

    }
    //console.log("---renameSession--index:"+i,session);
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };
  //console.log("--chat-list--role:"+role);
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chat-list">
        {(provided) => (
          <div
            className={styles["chat-list"]}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {sessions.map((item, i) => (
              <ChatItem
                title={item.topic}
                time={item.lastUpdate}
                count={item.messages.length}
                key={item.id}
                id={item.id}
                index={i}
                selected={i === selectedIndex}
                onClick={() => selectSession(i)}
                onDelete={() => chatStore.deleteSession(i)}
                renameSession={() => renameSession(i)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

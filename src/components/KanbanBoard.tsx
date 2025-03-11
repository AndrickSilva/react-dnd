import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BoardColumn, BoardContainer } from "./BoardColumn";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { type Task, TaskCard } from "./TaskCard";
import type { Column } from "./BoardColumn";
import { hasDraggableData } from "./utils";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

const fixedLeftColumn: Column = { id: "Cards", title: "Cards" };
const fixedRightColumn: Column = { id: "Elements", title: "Elements" };

const defaultCols: Column[] = [
  // Initial dynamic columns can be added here if needed
];

export type ColumnId = (typeof defaultCols)[number]["id"];

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(defaultCols);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newTaskContent, setNewTaskContent] = useState<{ [key: string]: string }>({});

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  /** Add New Column */
  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newColumn: Column = { id: uuidv4(), title: newColumnTitle };
    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
  };

  /** Add New Task */
  const addTask = (columnId: ColumnId) => {
    const content = newTaskContent[columnId]?.trim();
    if (!content) return;

    const newTask: Task = {
      id: uuidv4(),
      columnId,
      content,
    };
    setTasks([...tasks, newTask]);
    setNewTaskContent((prev) => ({ ...prev, [columnId]: "" }));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {/* Column Input Field */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="New column name"
          value={newColumnTitle}
          className="border-2 border-gray-300 p-1 rounded-md mr-4"
          onChange={(e) => setNewColumnTitle(e.target.value)}
        />
        <button onClick={addColumn} className=" " >Add Column</button>
      </div>

      <BoardContainer>
        <div className="flex flex-row min-w-full justify-center">
          {/* Fixed Left Column */}
          <div className="flex-shrink-0 fixed left-0 z-10">
            <BoardColumn
              column={fixedLeftColumn}
              tasks={tasks.filter((task) => task.columnId === fixedLeftColumn.id)}
            />
          </div>

          {/* Dynamic Columns */}
          {/* <div className="flex-grow ">wsdw</div> */}
          {/* Dynamic Columns */}
          <div className="justify-center flex-row flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <div key={col.id} className="flex items-center flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="New task"
                      className="border-2 border-gray-300 p-1 rounded-md"
                      value={newTaskContent[col.id] || ""}
                      onChange={(e) =>
                        setNewTaskContent((prev) => ({ ...prev, [col.id]: e.target.value }))
                      }
                    />
                    <button onClick={() => addTask(col.id)} className="bg-slate-200 px-2 py-1 rounded text-slate-800">Add</button>
                  </div>
                  <BoardColumn
                    column={col}
                    tasks={tasks.filter((task) => task.columnId === col.id)}
                  />
                </div>
              ))}
            </SortableContext>
          </div>

          {/* Fixed Right Column */}
          <div className="flex-shrink-0 fixed right-0 z-10">
            <BoardColumn
              column={fixedRightColumn}
              tasks={tasks.filter((task) => task.columnId === fixedRightColumn.id)}
            />
          </div>
        </div>
      </BoardContainer>

      {"document" in window &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <BoardColumn
                isOverlay
                column={activeColumn}
                tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
              />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Task") {
      setActiveTask(data.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    if (!isActiveAColumn) return;

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === "Task";
    const isOverATask = overData?.type === "Task";

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        const activeTask = tasks[activeIndex];
        const overTask = tasks[overIndex];

        if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
          return tasks.map((t) =>
            t.id === activeId ? { ...t, columnId: overTask.columnId } : t
          );
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = overData?.type === "Column";
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeId ? { ...task, columnId: overId as ColumnId } : task
        )
      );
    }
  }
}

import { useDrag, useDrop } from 'react-dnd';

interface DragItem {
  id: string;
  index: number;
}

export function useDragAndDrop(items: any[], setItems: (items: any[]) => void, itemIndex: number) {
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = items[dragIndex];
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    setItems(newItems);
  };

  const [, drop] = useDrop({
    accept: 'WEBSITE_CARD',
    hover(item: DragItem, monitor) {
      if (!monitor.isOver({ shallow: true })) return;

      const dragIndex = item.index;
      const hoverIndex = items.findIndex((i) => i.id === item.id);

      if (dragIndex === hoverIndex) return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop: () => ({ name: 'WEBSITE_CARD' }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'WEBSITE_CARD',
    item: () => {
      const item = items[itemIndex];
      return {
        id: item?.id || '',
        index: itemIndex,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return { drag, drop, isDragging };
}

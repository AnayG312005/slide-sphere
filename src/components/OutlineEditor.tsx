import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

export type OutlineSlide = {
  id: string;
  title: string;
  summary: string;
  layout: "title" | "content" | "two-column" | "quote" | "closing";
};

interface Props {
  deckTitle: string;
  description: string;
  slides: OutlineSlide[];
  onChange: (next: { deckTitle?: string; description?: string; slides?: OutlineSlide[] }) => void;
}

function SortableRow({ slide, idx, total, update, remove }: {
  slide: OutlineSlide; idx: number; total: number;
  update: (id: string, patch: Partial<OutlineSlide>) => void;
  remove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const words = (slide.title + " " + slide.summary).trim().split(/\s+/).filter(Boolean).length;
  return (
    <div ref={setNodeRef} style={style} className="group flex gap-2 items-start p-3 rounded-2xl border bg-card hover:border-primary/40 transition">
      <button {...attributes} {...listeners} className="p-1.5 mt-1 rounded hover:bg-accent cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Drag">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          <span>Slide {idx + 1} / {total}</span>
          <select
            value={slide.layout}
            onChange={(e) => update(slide.id, { layout: e.target.value as OutlineSlide["layout"] })}
            className="bg-transparent border rounded px-1.5 py-0.5 text-[10px] uppercase tracking-widest"
          >
            <option value="title">Title</option>
            <option value="content">Content</option>
            <option value="two-column">Two column</option>
            <option value="quote">Quote</option>
            <option value="closing">Closing</option>
          </select>
          <span className="ml-auto">{words} words</span>
        </div>
        <input
          value={slide.title}
          onChange={(e) => update(slide.id, { title: e.target.value })}
          className="w-full bg-transparent font-medium text-ink text-sm focus:outline-none"
          placeholder="Slide title"
        />
        <textarea
          value={slide.summary}
          onChange={(e) => update(slide.id, { summary: e.target.value })}
          rows={2}
          className="mt-1 w-full bg-transparent text-xs text-muted-foreground focus:outline-none resize-none"
          placeholder="One-line summary of the slide"
        />
      </div>
      <button onClick={() => remove(slide.id)} className="p-1.5 mt-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function OutlineEditor({ deckTitle, description, slides, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = slides.findIndex(s => s.id === active.id);
    const newIdx = slides.findIndex(s => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange({ slides: arrayMove(slides, oldIdx, newIdx) });
  };

  const update = (id: string, patch: Partial<OutlineSlide>) =>
    onChange({ slides: slides.map(s => s.id === id ? { ...s, ...patch } : s) });
  const remove = (id: string) => onChange({ slides: slides.filter(s => s.id !== id) });
  const add = () => onChange({ slides: [...slides, { id: `s-${slides.length}-${Date.now()}`, title: "New slide", summary: "", layout: "content" }] });

  const totalWords = slides.reduce((n, s) => n + (s.title + " " + s.summary).trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-secondary/40 p-3.5">
        <input
          value={deckTitle}
          onChange={(e) => onChange({ deckTitle: e.target.value })}
          className="w-full bg-transparent font-display text-2xl text-ink focus:outline-none"
          placeholder="Deck title"
        />
        <input
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none mt-1"
          placeholder="One-line description"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {slides.map((s, i) => (
              <SortableRow key={s.id} slide={s} idx={i} total={slides.length} update={update} remove={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between">
        <button onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border bg-card text-sm text-ink hover:bg-accent">
          <Plus className="w-4 h-4" /> Add slide
        </button>
        <p className="text-xs text-muted-foreground">{slides.length} slides · {totalWords} outline words</p>
      </div>
    </div>
  );
}

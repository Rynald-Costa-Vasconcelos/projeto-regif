import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import clsx from "clsx";
import type { NewsLinkDTO } from "../../../types";

interface Props {
  links: NewsLinkDTO[];
  actions: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, patch: Partial<NewsLinkDTO>) => void;
  };
  enableLinks: boolean;
  setEnableLinks: (v: boolean) => void;
}

export function NewsEditorLinks({ links, actions, enableLinks, setEnableLinks }: Props) {
  return (
    <details className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <summary className="cursor-pointer select-none list-none px-6 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm">Links Relacionados</span>
          <span className="text-[10px] text-gray-400">Cards extras para leitura</span>
        </div>
        
        <button
          type="button"
          onClick={(e) => {
             e.preventDefault();
             if (!enableLinks) setEnableLinks(true);
             else actions.add();
          }}
          className={clsx(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
            !enableLinks ? "bg-gray-50 text-gray-500 hover:bg-gray-100" : "bg-regif-blue/10 text-regif-blue border-regif-blue/20 hover:bg-regif-blue/20"
          )}
        >
          <Plus size={14} /> {enableLinks ? "Adicionar" : "Ativar"}
        </button>
      </summary>

      <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
        {!enableLinks ? (
           <p className="text-xs text-gray-500">Links desativados.</p>
        ) : (
          <div className="space-y-3">
            {links.length === 0 ? (
              <div className="text-center p-4 text-xs text-gray-400 border border-dashed rounded-xl">
                 Clique em "Adicionar" para incluir um link.
              </div>
            ) : (
              links.map((l, idx) => (
                <div key={idx} className="border rounded-2xl p-3 bg-gray-50 flex gap-3 items-start group">
                   <div className="mt-2 text-gray-400"><LinkIcon size={16} /></div>
                   <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">URL</label>
                        <input
                          value={l.url}
                          onChange={(e) => actions.update(idx, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl border bg-white text-xs focus:ring-1 focus:ring-regif-blue"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                           value={l.title ?? ""}
                           onChange={(e) => actions.update(idx, { title: e.target.value })}
                           placeholder="Título (Opcional)"
                           className="w-full px-3 py-2 rounded-xl border bg-white text-xs"
                        />
                         <input
                           value={l.description ?? ""}
                           onChange={(e) => actions.update(idx, { description: e.target.value })}
                           placeholder="Descrição (Opcional)"
                           className="w-full px-3 py-2 rounded-xl border bg-white text-xs"
                        />
                      </div>
                   </div>
                   <button
                     type="button"
                     onClick={() => actions.remove(idx)}
                     className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                     title="Remover Link"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </details>
  );
}
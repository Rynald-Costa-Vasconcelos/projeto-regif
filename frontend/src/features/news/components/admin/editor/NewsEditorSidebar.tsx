import type { NewsCategoryDTO, PostStatus } from "../../../types";

interface Props {
  status: PostStatus;
  setStatus: (s: PostStatus) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  categories: NewsCategoryDTO[];
  toggles: {
    isFeatured: boolean; setIsFeatured: (v: boolean) => void;
    showFeaturedImage: boolean; setShowFeaturedImage: (v: boolean) => void;
    enableGallery: boolean; setEnableGallery: (v: boolean) => void;
    enableLinks: boolean; setEnableLinks: (v: boolean) => void;
  };
}

interface ToggleItemProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  sub: string;
}

function ToggleItem({ checked, onChange, label, sub }: ToggleItemProps) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded text-regif-blue" />
      <div className="flex flex-col">
        <span className="text-sm font-bold">{label}</span>
        <span className="text-[10px] text-gray-400">{sub}</span>
      </div>
    </label>
  );
}

export function NewsEditorSidebar(props: Props) {
  const { toggles } = props;
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <h3 className="font-bold text-gray-800 text-sm">Configurações</h3>
      
      <div className="grid grid-cols-1 gap-3">
        <ToggleItem checked={toggles.isFeatured} onChange={toggles.setIsFeatured} label="Matéria de Capa" sub="Destaque principal" />
        <ToggleItem checked={toggles.showFeaturedImage} onChange={toggles.setShowFeaturedImage} label="Mostrar imagem" sub="Se OFF, só 'capa' interna" />
        <ToggleItem checked={toggles.enableGallery} onChange={toggles.setEnableGallery} label="Galeria" sub="Imagens no final" />
        <ToggleItem checked={toggles.enableLinks} onChange={toggles.setEnableLinks} label="Links" sub="Cards relacionados" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
          <select value={props.status} onChange={e => props.setStatus(e.target.value as PostStatus)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm">
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="HIDDEN">Oculto</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
          <select value={props.categoryId} onChange={e => props.setCategoryId(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm">
            <option value="">Sem categoria</option>
            {props.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
import { CollectionList } from '@/modules/collection/CollectionList';

export default function CollectionPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <h1 className="text-lg font-bold">Colecția mea 💿</h1>
      </header>
      <CollectionList />
    </div>
  );
}

export default function Scan() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Scanner</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          Identifier une œuvre
        </h1>
      </div>

      {/* Scanner placeholder */}
      <div className="aspect-[3/4] max-w-md mx-auto relative rounded-xl overflow-hidden bg-surface-dark">
        {/* Focus brackets */}
        <div className="absolute inset-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <span className="material-symbols-outlined text-6xl text-white/20 mb-4">photo_camera</span>
          <p className="text-white/60 mb-6">
            Fonctionnalité en développement
          </p>
          <p className="text-white/40 text-sm">
            Bientôt vous pourrez scanner des œuvres avec votre caméra ou importer une photo
          </p>
        </div>
      </div>

      {/* Buttons placeholder */}
      <div className="max-w-md mx-auto mt-6 flex gap-4">
        <button
          disabled
          className="flex-1 bg-white/10 text-white/40 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <span className="material-symbols-outlined">photo_camera</span>
          Prendre une photo
        </button>
        <button
          disabled
          className="flex-1 border border-white/20 text-white/40 py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <span className="material-symbols-outlined">image</span>
          Galerie
        </button>
      </div>
    </div>
  )
}
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold mb-8 animate-pulse">
           HBM OFX 
        </h1>
        
        <h2 className="text-3xl font-semibold mb-6">
          Sistema de Conversão PDF para OFX
        </h2>
        
        <p className="text-xl mb-8 text-gray-300">
          Converta seus extratos bancários em PDF para o formato OFX
        </p>
        
        <div className="bg-white text-black p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-4">Upload de PDF</h3>
          <div className="border-2 border-dashed border-gray-400 p-8 rounded-lg">
            <input type="file" accept=".pdf" className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-400 rounded mb-4"></div>
              <span className="text-lg font-medium">Clique para selecionar PDF</span>
            </label>
          </div>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl">
          Converter para OFX
        </button>
        
        <div className="mt-8 text-sm text-gray-400">
          <p> Processamento seguro</p>
          <p> Bancos brasileiros</p>
          <p> Formato OFX padrão</p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="home" className="bg-gradient-to-r from-green-800 to-green-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Brigada Ambiental
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Protegendo nossas florestas e preservando o meio ambiente através de ações coordenadas e tecnologia de ponta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Conheça Nosso Trabalho
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-800 transition-colors">
              Junte-se a Nós
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
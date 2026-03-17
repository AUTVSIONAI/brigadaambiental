export function Projects() {
  const projects = [
    {
      title: "Reflorestamento da Serra do Mar",
      description: "Recuperação de áreas degradadas com plantio de espécies nativas.",
      status: "Em Andamento",
      area: "500 hectares",
    },
    {
      title: "Monitoramento da Fauna",
      description: "Estudo e proteção da biodiversidade local.",
      status: "Ativo",
      area: "12 mil hectares",
    },
    {
      title: "Prevenção de Incêndios",
      description: "Sistema de alerta precoce e faixas de contenção.",
      status: "Concluído",
      area: "Toda região",
    },
  ];

  return (
    <section id="projects" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossos Projetos
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Conheça as iniciativas que estamos desenvolvendo para proteger o meio ambiente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                  project.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {project.area}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
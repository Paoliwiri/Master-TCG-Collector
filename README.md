# 🃏 Master TCG Collector

> Una experiencia ultrarrápida, moderna y elegante para explorar una base de datos masiva de más de 60,000 cartas de Trading Card Games (TCG). 

Este proyecto es una Single Page Application (SPA) estática alojada en GitHub Pages. Está diseñada para ofrecer un rendimiento excepcional y una búsqueda instantánea sin necesidad de un servidor backend tradicional, utilizando técnicas de división de datos (Data Chunking) y carga paralela.

---

## ✨ Características Principales

* 🚀 **Rendimiento Extremo:** Carga paralela de una base de datos de +63k registros mediante archivos JSON fragmentados para eludir los límites de tamaño en navegadores y servidores estáticos.
* 📸 **Búsqueda Visual:** Encuentra tus cartas subiendo una imagen o simplemente usando `Ctrl+V`. El sistema utiliza un algoritmo de *Average Hashing* del lado del cliente para comparar y encontrar coincidencias visuales.
* 🎨 **Filtrado por Paleta de Colores:** Algoritmo matemático para filtrar la colección basándose en los colores dominantes de cada carta.
* ⚖️ **Cuarto de Comparación y Favoritos:** Guarda tus cartas preferidas en la memoria local (LocalStorage) o compáralas lado a lado en alta resolución.
* ✨ **Visor 4K:** Sistema de visualización detallada con soporte para enlaces de imágenes de alta resolución nativa.
* 📱 **Diseño 100% Responsivo:** Interfaz adaptable impulsada por Tailwind CSS, con un panel de filtros ocultable en dispositivos móviles para maximizar el espacio visual.
* 🌗 **Modo Oscuro/Claro:** Integrado y adaptable a las preferencias del sistema del usuario.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (v3 via CDN).
* **Procesamiento de Datos:** Python y SQLite3 (para la exportación, limpieza y división de la base de datos original).
* **Hosting:** GitHub Pages.

---

## 🤝 Créditos y Proveedores de Datos

Este proyecto es estrictamente un agregador y un visor. No sería posible sin el colosal trabajo de recopilación que realizan las siguientes plataformas y comunidades. Todo el mérito por las imágenes y metadatos pertenece a:

* **[TCGdex](https://tcgdex.dev/):** Por su robusta API y su gestión de assets de altísima calidad.
* **[Eyevo TCG](https://eyevotcg.com/es/):** Por su extensa base de datos y dedicación al TCG.
* **[PokeScreener](https://pokescreener.com/):** Por su excelente catalogación e imágenes.
* **[TCG Collector](https://www.tcgcollector.com/):** Por mantener una de las colecciones más completas y actualizadas de la red.

---

## ⚖️ Aviso Legal y Exención de Responsabilidad

**Este proyecto ha sido creado estrictamente con fines educativos, de aprendizaje técnico y como demostración de habilidades de programación frontend. NO tiene fines de lucro ni comerciales.**

* **Indexación y Alojamiento:** Master TCG Collector **no aloja** ninguna de las imágenes mostradas en sus repositorios o servidores. La aplicación funciona como un índice visual que enlaza (hotlinks) hacia las URLs públicas originales de los proveedores mencionados anteriormente.
* **Extracción de Datos (Scraping):** Los datos estructurados mostrados en esta aplicación fueron obtenidos mediante métodos de recolección automatizada sin autorización explícita de los proveedores. Se reitera que el único fin de esto es el uso personal y educativo ("Fair Use").
* **Propiedad Intelectual:** Los nombres, logotipos, símbolos y diseños de las cartas pertenecen a sus respectivos dueños legales (incluyendo *Nintendo, Creatures Inc., Game Freak Inc., y The Pokémon Company International*). Esta web no está afiliada, respaldada ni patrocinada por ninguna de estas entidades ni por los proveedores de datos listados.
* **Retirada de Contenido (Takedown):** Si eres administrador de alguno de los sitios proveedores o propietario de los derechos de autor de algún material indexado aquí y deseas que tu contenido sea retirado de esta base de datos demostrativa, por favor abre un *Issue* en este repositorio y los enlaces/datos serán eliminados inmediatamente sin hacer preguntas.

---

<p align="center">
  <i>Desarrollado con ❤️ para la comunidad de coleccionistas y apasionados del código.</i>
</p>

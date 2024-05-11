const cssPromises = {};

export async function loadResource(src) {
    if (src.endsWith('.js')) {
        return await import(src);
    }

    if (src.endsWith('.css')) {
        if (!cssPromises[src]) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = src;
            cssPromises[src] = new Promise(resolve => {
                link.addEventListener('load', () => resolve());
                link.addEventListener('error', () => resolve()); // Обработка ошибок загрузки CSS
            });
            document.head.append(link);
        }
        return await cssPromises[src];
    }

    const res = await fetch(src);
    if (!res.ok) {
        throw new Error(`Failed to fetch resource: ${src}`);
    }
    return await res.json();
}

const episodesContainer = document.getElementById('episodes');
const searchParams = new URLSearchParams(location.search);

const episodeId = searchParams.get('episode');

async function renderPage(moduleName, apiUrl, css) {
    const [pageModule, data] = await Promise.all([loadResource(moduleName), loadResource(apiUrl)]);
    episodesContainer.innerHTML = '';
    episodesContainer.append(pageModule.render(data));
}

async function renderDetailsPage(moduleName, apiUrl, css, planets, species) {
    const [pageModule, data] = await Promise.all([loadResource(moduleName), loadResource(apiUrl)]);
    episodesContainer.innerHTML = '';
    const [loadedPlanets, loadedSpecies] = await Promise.all([
        Promise.all(data.result.properties.planets.map(src => loadResource(src))),
        Promise.all(data.result.properties.species.map(src => loadResource(src)))
    ]);
    episodesContainer.append(pageModule.render(data, loadedPlanets, loadedSpecies));
}

if (episodeId) {
    renderDetailsPage(
        './episodes-details.js',
        `https://www.swapi.tech/api/films/${episodeId}`,
        'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css'
    ).catch(error => console.error('Failed to render details page:', error));
} else {
    renderPage(
        './episodes-list.js',
        'https://www.swapi.tech/api/films',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css'
    ).catch(error => console.error('Failed to render page:', error));
}

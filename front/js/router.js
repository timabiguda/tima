// ИЗМЕНЕНИЕ: Создан изолированный модуль клиeнтского SPA-роутера.
import { loadArticlesList, loadSingleArticle } from './articles.js';

// ИЗМЕНЕНИЕ: Карта маршрутов, связывающая URL страницы с ее отображением
const routes = {
    '/': () => showPage('view-articles', loadArticlesList),
    '/articles': () => showPage('view-articles', loadArticlesList),
    '/editor': () => showPage('view-editor')
};

// ИЗМЕНЕНИЕ: Функция скрывает все экраны и показывает только запрашиваемый по ID
function showPage(viewId, callback) {
    document.querySelectorAll('.page-view').forEach(view => {
        view.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = 'block';
        if (callback) callback();
    }
}

// ИЗМЕНЕНИЕ: Навигация без перезагрузки через history.pushState
export function navigateTo(url) {
    window.history.pushState(null, null, url);
    renderRoute();
}

// ИЗМЕНЕНИЕ: Сопоставление текущего pathname из браузера с маршрутами
export function renderRoute() {
    const path = window.location.pathname;

    // ИЗМЕНЕНИЕ: Динамический роут для просмотра конкретной статьи /articles/:id
    if (path.startsWith('/articles/')) {
        const articleId = path.split('/')[2];
        showPage('view-article-detail', () => loadSingleArticle(articleId));
        return;
    }

    const action = routes[path] || routes['/'];
    action();
}

// ИЗМЕНЕНИЕ: Инициализация слушателей для перехвата стандартных кликов по ссылкам
export function initRouter() {
    // Слушаем кнопки Назад/Вперед в браузере
    window.addEventListener('popstate', renderRoute);

    // Перехватываем клики по всем ссылкам с классом .nav-link для применения SPA
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
            e.preventDefault();
            const targetUrl = link.getAttribute('href');
            navigateTo(targetUrl);
        }
    });

    // Отрисовываем текущий роут при первом входе
    renderRoute();
}
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

const DB_FILE = './db.json';
const URI_PREFIX = '/api/todos';
const PORT = 3000;


class TodoApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON
 * @param {Object} req - Объект HTTP запроса
 * @throws {TodoApiError} Некорректные данные в аргументе
 * @returns {Object} Объект, созданный из тела запроса
 */
function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

/**
 * Проверяет входные данные и создаёт из них корректный объект дела
 * @param {Object} data - Объект с входными данными
 * @throws {TodoApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, owner: string, done: boolean }} Объект дела
 */
function makeTodoItemFromData(data) {
  const errors = [];

  const todoItem = {
    owner: data.owner && String(data.owner),
    name: data.name && String(data.name),
    done: Boolean(data.done),
  };

  if (!todoItem.owner) errors.push({ field: 'owner', message: 'Не указан ответственный' });
  if (!todoItem.name) errors.push({ field: 'name', message: 'Не указан заголовок задачи' });
  if (!todoItem.done) todoItem.done = false;

  if (errors.length) throw new TodoApiError(422, { errors });

  return todoItem;
}

/**
 * Возвращает список дел из базы данных
 * @param {{ owner: string }} [params] - Фильтр по владельцу дела
 * @returns {{ name: string, owner: string, done: boolean }[]} Массив дел
 */
function getTodoList(params = {}) {
  const todoList = JSON.parse(readFileSync(DB_FILE) || '[]');
  if (params.owner) return todoList.filter(({ owner }) => owner === params.owner);
  return todoList;
}

/**
 * Создаёт и сохраняет дело в базу данных
 * @throws {TodoApiError} Некорректные данные в аргументе, дело не создано (statusCode 422)
 * @param {Object} data - Данные из тела запроса
 * @returns {{ name: string, owner: string, done: boolean }} Объект дела
 */
function createTodoItem(data) {
  const newItem = makeTodoItemFromData(data);
  newItem.id = Date.now().toString();
  writeFileSync(DB_FILE, JSON.stringify([...getTodoList(), newItem]), { encoding: 'utf8' });
  return newItem;
}

/**
 * Возвращает объект дела по его ID
 * @param {string} itemId - ID дела
 * @throws {TodoApiError} Дело с таким ID не найдено (statusCode 404)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function getTodoItem(itemId) {
  const todoItem = getTodoList().find(({ id }) => id === itemId);
  if (!todoItem) throw new TodoApiError(404, { message: 'TODO Item Not Found' });
  return todoItem;
}

/**
 * Изменяет дело с указанным ID и сохраняет изменения в базу данных
 * @param {string} itemId - ID изменяемого дела
 * @param {{ name?: string, owner?: string, done?: boolean }} data - Объект с изменяемыми данными
 * @throws {TodoApiError} Дело с таким ID не найдено (statusCode 404)
 * @throws {TodoApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function updateTodoItem(itemId, data) {
  const todoItems = getTodoList();
  const itemIndex = todoItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new TodoApiError(404, { message: 'TODO Item Not Found' });
  Object.assign(todoItems[itemIndex], makeTodoItemFromData({ ...todoItems[itemIndex], ...data }));
  writeFileSync(DB_FILE, JSON.stringify(todoItems), { encoding: 'utf8' });
  return todoItems[itemIndex];
}

/**
 * Удаляет дело из базы данных
 * @param {string} itemId - ID дела
 * @returns {{}}
 */
function deleteTodoItem(itemId) {
  const todoItems = getTodoList();
  const itemIndex = todoItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new TodoApiError(404, { message: 'TODO Item Not Found' });
  todoItems.splice(itemIndex, 1);
  writeFileSync(DB_FILE, JSON.stringify(todoItems), { encoding: 'utf8' });
  return {};
}

if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        // /api/todos
        if (req.method === 'GET') return getTodoList(queryParams);
        if (req.method === 'POST') {
          const newTodoItem = createTodoItem(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Location', `${URI_PREFIX}/${newTodoItem.id}`);
          return newTodoItem;
        }
      } else {
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getTodoItem(itemId);
        if (req.method === 'PATCH') return updateTodoItem(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteTodoItem(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    if (err instanceof TodoApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
  .on('listening', () => {
    console.log(`Сервер TODO запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
    console.log('Нажмите CTRL+C, чтобы остановить сервер');
    console.log('Доступные методы:');
    console.log(`GET ${URI_PREFIX} - получить список дел, query параметр owner фильтрует по владельцу`);
    console.log(`POST ${URI_PREFIX} - создать дело, в теле запроса нужно передать объект { name: string, owner: string, done?: boolean }`);
    console.log(`GET ${URI_PREFIX}/{id} - получить дело по его ID`);
    console.log(`PATCH ${URI_PREFIX}/{id} - изменить дело с ID, в теле запроса нужно передать объект { name?: string, owner?: string, done?: boolean }`);
    console.log(`DELETE ${URI_PREFIX}/{id} - удалить дело по ID`);
  })
  .listen(PORT);
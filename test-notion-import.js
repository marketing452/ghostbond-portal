const { Client } = require('@notionhq/client');
console.log(Object.keys(new Client().databases));

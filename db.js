var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
// process.env has key-value pair => NODE_ENV = key
var sequelize;

if (env === 'production') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres' // set prostgres db in heroku
	});
}else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname+'/data/dev-todo-api.sqlite'
	});
}

// var sequelize = new Sequelize(undefined, undefined, undefined, {
// 	'dialect': 'sqlite',
// 	'storage': __dirname+'/data/dev-todo-api.sqlite'
// });
var db = {};

db.todo = sequelize.import(__dirname+'/models/todo.js');
db.user = sequelize.import(__dirname+'/models/user.js');
db.tokens = sequelize.import(__dirname+'/models/tokens.js');
// load model to separate model => copy to new folder
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);


module.exports = db;

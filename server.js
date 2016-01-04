var express = require('express');
var bodyParser = require('body-parser');
var _= require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));

/*
app.get('/', function(req, res) {
	res.send('<h1>Todo API Root</h1>');
});
*/

// GET /todos?completed=true&keyword=work
app.get('/todos', middleware.requireAuthentication, function(req, res){
	var query  = req.query;
	var where =  {
		userId: req.user.get('id')
	};

	if(query.hasOwnProperty('completed') && _.isBoolean(JSON.parse(query.completed)) ){
		where.completed = JSON.parse(query.completed);
	} 
	if(query.hasOwnProperty('keyword') && query.keyword.trim().length>0  ){
		where.description = {$like: '%'+query.keyword+'%'} ;
	} 

	db.todo.findAll({where: where}).then(function(todos){
		res.json(todos);
	},function(e){
		res.status(500).send();
	});
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res){
	var todoId = parseInt(req.params.id);

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo){
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function (e){
		res.status(500).send();
		// error with database & server
	});
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then( function(todo){
		// already set req.user = user in middleware.js
		req.user.addTodo(todo).then( function() {
			return todo.reload();
		}).then( function (todo){
			res.json(todo.toJSON());
		});
	}, function (e){
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res){
	var todoId = parseInt(req.params.id);
	var matchedTodo = _.findWhere(todos, {id: todoId});
	
	db.todo.destroy({
			where:{
				id: todoId,
				userId: req.user.get('id')
			}
		}).then(function (rowDeleted){
			if (rowDeleted ===0){
				res.status(404).json({error: 'No todo list of that id'});
			} else {
				res.status(204).send();
			}
		},function (){
			res.status(500).send();
		});
});

// PUT /todos/:id   => update todo item

app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if( body.hasOwnProperty('completed') ) {
		attributes.completed = body.completed;
	}
	if ( body.hasOwnProperty('description') ) {
		attributes.description = body.description;
	}

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then( function (todo){
		if(todo){
			todo.update(attributes).then( function(){
				res.json(todo.toJSON());
			}, function (e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function(){
		res.status(500).send();
	});
	
});


////////// USER //////////

// POST user

app.post('/user', function (req, res) {

	var user = _.pick(req.body, 'email', 'password');
	
	db.user.create(user).then(function (user) {
		res.json(user.toPublicJSON());
	}, function (e){
		res.status(400).json(e);
	});

});

// POST /users/login

app.post('/user/login', function (req, res){
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;

	db.user.authenticate(body).then( function (foundUser) {
		var token = foundUser.generateToken('authentication');
		userInstance = foundUser;
		
		return db.tokens.create({
			token: token
		});
	}).then( function (tokenInstance) {
		res.header('Auth', tokenInstance.get('token')).json( userInstance.toPublicJSON() );
	}).catch( function(e){
		res.status(401).send();
	});

});

// DELETE /users/login
app.delete('/user/login', middleware.requireAuthentication, function (req,res){
	req.token.destroy().then(function(){
		res.status(204).send();
	}).catch( function(){
		res.status(500).send();
	});
});	


db.sequelize.sync({force: true}).then( function(){
	app.listen(PORT, function(){
		console.log('express listenting on port '+PORT);
	});
} );



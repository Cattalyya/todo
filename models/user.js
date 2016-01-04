var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataType) {
	var user = sequelize.define('user', {
		email: {
			type: DataType.STRING,
			allowNull: false,
			unique: true, // to add new user => no other user's email in db is the same as new email
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataType.STRING
		},
		password_hash: {
			type: DataType.STRING
		},
		password: {
			type: DataType.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7,100]
			},
			set: function (value) {
				var salt = bcrypt.genSaltSync(10); // 10 = nember of char in salt string
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password',value);
				this.setDataValue('salt',salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if(typeof user.email === 'string')
					user.email = user.email.toLowerCase();
			}
		},
		instanceMethods: {
			toPublicJSON: function () { // return public property
				var json = this.toJSON();
				return _.pick(json,'id','email','createdAt','updatedAt');
			},
			generateToken: function (type) {
				// most time type = authentication
				if (!_.isString(type)){
					return undefined;
				}

				try {
					// encrypt user
					var stringData = JSON.stringify({id: this.get('id'), type: type}); // convert to string to be able to used with AES
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123&*%').toString(); 
					var token = jwt.sign({
						token: encryptedData
					},'qwerty098'); // 'qwerty098' is jwt password = set of random string

					return token;
				} catch (e) {
					return undefined;
				}
			}
		},
		classMethods: {
			authenticate: function (body) {
				return new Promise (function (resolve, reject) {

					if (typeof body.email !== 'string' || typeof body.password !== 'string'){
						return reject();
					}
					user.findOne ({
						where: {
							email: body.email
						}
					}).then( function (foundUser) {
						if(!foundUser || !bcrypt.compareSync(body.password,foundUser.get('password_hash')) )
							return reject();
						resolve(foundUser);
					}, function (e) {
						reject();
					});
				});
			},
			findByToken: function (token) {
				return new Promise (function(resolve, reject){
					try{
						var decodedJWT = jwt.verify(token, 'qwerty098');
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123&*%');
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then( function (user){
							if (user){
								resolve(user);
							} else {
								reject();
							}
						});

					} catch (e) {
						reject();
					}
				});
			}
		}
	});
	return user;
}
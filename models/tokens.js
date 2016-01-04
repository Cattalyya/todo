var cryptojs = require('crypto-js');

module.exports = function (sequelize, Datatypes) {

	return sequelize.define('tokens', {
		token: {
			type: Datatypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [1]
			},
			set: function (value) {
				var hash = cryptojs.MD5(value).toString();
				this.setDataValue('token', value);
				this.setDataValue('tokenHash',hash);
				console.log('Token hash is '+hash);
			}
		},
		tokenHash: Datatypes.STRING

	});
};
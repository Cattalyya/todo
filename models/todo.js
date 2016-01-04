module.exports =  function(sequelize, DataTypes) {
	return sequelize.define('todo', {
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			// not optional => require to fill form
			validate:{
				len: [1,250]
			}
		},
		completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
			// if not give value => it's ok
		}
	});
};
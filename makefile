# Define the node_modules/.bin directory to use locally installed packages
NODE_MODULES_BIN := ./node_modules/.bin

# Command to install dependencies
install:
	npm install nodemon
	npm install bcrypt
	npm install jsonwebtoken
	npm install swagger-ui-express swagger-jsdoc
	npx sequelize-cli db:migrate
	npm install nodemailer

start:
	npm start

push:
	git add .
	git commit -m "Commit on $$(date '+%Y%m%d%H%M%S')"
	git push

test:
	$(NODE_MODULES_BIN)/jest
exports.sqlQueries = {
    'ct_person': 'CREATE TABLE person (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL, idade INT, curso VARCHAR(100))',
    'showAllPerson': 'SELECT * FROM person',
    'addPerson': 'INSERT INTO alunos (nome, idade, curso) VALUES (?, ?, ?)',
};

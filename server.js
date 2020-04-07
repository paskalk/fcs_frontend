const express = require('express');
const path = require('path');
const app = express();

var cors = require('cors')

const port = process.env.PORT || 3030;

app.use(cors());
app.options('*', cors());

app.use("/", express.static(path.join(__dirname, 'build')));


console.log('Started sever on port ' + port);
app.listen(port);


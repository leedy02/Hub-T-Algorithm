const { PythonShell } = require("python-shell");
module.exports.candidates_and_route = async function (host_id, algorithm_num) {
  let options = {
    pythonPath: '/usr/bin/python3',
    scriptPath: '/Users/llsg822/Development/hub_t_comamnd/taxi/routes',
    args: [host_id,algorithm_num],
    mode: 'json',
    pythonOptions: ['-u']
  };
  const result = await new Promise((resolve, reject) => {
    PythonShell.run('algorithm.py', options, function (err, data) {
      if (err) return reject(err);
      return resolve(data);
    });
  });
  return result;
};
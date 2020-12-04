const { PythonShell } = require("python-shell");
module.exports.candidates_and_route = async function (host_id, algorithm_num) {
  let options = {
    pythonPath: 'C:/Anaconda3/python.exe',
    scriptPath: 'C:/Users/User/Desktop/Hub-T-Algorithm/algorithm/routes',
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
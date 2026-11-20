const { spawn } = require('node:child_process');

const childEnvironment = {
    ...process.env,
    OBS_SOCKET_SERVER_URL: process.env.OBS_SOCKET_SERVER_URL || 'http://127.0.0.1:3000'
};

const processes = [
    spawn(process.execPath, ['server.js'], {
        env: childEnvironment,
        stdio: 'inherit'
    }),
    spawn(process.execPath, ['obs-connection.js'], {
        env: childEnvironment,
        stdio: 'inherit'
    })
];

let shuttingDown = false;

function stop(exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    for (const child of processes) {
        if (!child.killed) child.kill();
    }

    process.exitCode = exitCode;
}

for (const child of processes) {
    child.on('error', error => {
        console.error('Failed to start a child process:', error);
        stop(1);
    });

    child.on('exit', (code, signal) => {
        if (shuttingDown) return;
        console.error(`A child process stopped (${signal || `exit code ${code}`}).`);
        stop(code || 1);
    });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

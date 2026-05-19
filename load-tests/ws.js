import ws from 'k6/ws';
import { check, sleep } from 'k6';

export let options = {
  vus: 20,
  duration: '30s',
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:3001/socket';

export default function () {
  const res = ws.connect(WS_URL, null, function (socket) {
    socket.on('open', function () {
      // keep connection alive briefly
      socket.send('ping');
    });

    socket.on('message', function (msg) {
      // noop
    });

    socket.on('close', function () {
      // noop
    });

    socket.setInterval(function () {
      socket.ping();
    }, 1000);

    // close after short delay
    sleep(5);
    socket.close();
  });

  check(res, { connected: (r) => r && r.status === 101 });
}

// src/hooks.server.ts
export const handle = async ({ event, resolve }) => {
    const cookie = event.request.headers.get('cookie') || '';
    let user = null;
    console.log("cookie: ", cookie);

    try {
      const res = await fetch('http://localhost:8000/api/user', {
        headers: {
        //   'cookie': cookie,
          'accept': 'application/json',
          'origin': 'http://localhost:5173',
          'X-XSRF-TOKEN' : 'eyJpdiI6ImR0T3pobjg1VnJIN2VEcHg2K3VmNGc9PSIsInZhbHVlIjoidlR1QUN0MkoyaUhaVGRFZGhvbWIyK1ZmZFk3TDhTSnhBd2Roek0rZlk3STZvZlI4dTROUW1RV3VacmF6MmR4ZHk5d2p1TzRTYVBidnJnb2xDOFIzY3FGZVRYYzQ5UEZHaEFuSDlNUUNJVnRvQVdwQk0wRnJaY1dOTnNqdlNqRVMiLCJtYWMiOiJjN2E5MDAwZDkzZGM5YjE3OWY5YzA4MzE3YmI3Y2QyNmVmNzhiZjA1ODEwY2YwMWYzMDY5MDFhMzU5OWIzNmQ5IiwidGFnIjoiIn0'
        },
        credentials: 'include'
      });
      if (res.ok) {
        user = await res.json();
      }
    } catch (e) {
      user = null;
    }
    event.locals.user = user;
    console.log("user: ", user);
    return resolve(event);
  };
  
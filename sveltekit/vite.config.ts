import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// export default defineConfig({
// 	plugins: [sveltekit()],
// 	server: {
// 		proxy: {
// 		  '/api': {
// 			target: 'http://localhost:8000',
// 			changeOrigin: true,
// 			// secure: false,
// 			// rewrite: (path) => path.replace(/^\/api/, '/api'),



// 			// configure: (proxy) => {
// 			// 	proxy.on('proxyReq', (proxyReq) => {
// 			// 	  proxyReq.setHeader('Cookie', `laravel_session=${event.cookies.get('laravel_session')}`);
// 			// 	});
// 			//   },
//  		  }
// 		}
// 	  }
// });
export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/api': 'http://localhost:8000',
		  },
		// host: '0.0.0.0',
		// allowedHosts: ['frontend.local', 'api.local'],
	//   proxy: {
	// 	'/api': {
	// 	  target: 'http://localhost:8000',
	// 	  changeOrigin: true,
	// 	  rewrite: (path) => path.replace(/^\/api/, ''),
	// 	},
	// 	'/sanctum': {
	// 	  target: 'http://localhost:8000',
	// 	  changeOrigin: true,
	// 	  rewrite: (path) => path.replace(/^\/sanctum/, ''),
	// 	},
	// 	'/login': {
	// 	  target: 'http://localhost:8000',
	// 	  changeOrigin: true,
	// 	},
	// 	'/logout': {
	// 	  target: 'http://localhost:8000',
	// 	  changeOrigin: true,
	// 	},
	//   },
	},
  });

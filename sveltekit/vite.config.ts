import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
		  '/api': {
			target: 'http://localhost:8000',
			changeOrigin: true,
			// secure: false,
			// rewrite: (path) => path.replace(/^\/api/, '/api'),



			// configure: (proxy) => {
			// 	proxy.on('proxyReq', (proxyReq) => {
			// 	  proxyReq.setHeader('Cookie', `laravel_session=${event.cookies.get('laravel_session')}`);
			// 	});
			//   },
 		  }
		}
	  }
});

import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'VITE_');
 return {plugins:[react()],server:{strictPort:true,port:5173,proxy:env.VITE_DEV_API_TARGET?{'/api':{target:env.VITE_DEV_API_TARGET,changeOrigin:false,rewrite:p=>p.replace(/^\/api/,'')}}:undefined}};
});


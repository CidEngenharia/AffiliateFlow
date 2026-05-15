const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const scanner = require('./scanner');
require('dotenv').config();

// Registro de Plugins
fastify.register(cors, { 
  origin: true 
});

// Endpoint Principal de Scan
fastify.post('/api/scan', async (request, reply) => {
  const { url, userId } = request.body;
  
  if (!url) {
    return reply.status(400).send({ error: 'URL is required' });
  }

  try {
    fastify.log.info(`Iniciando análise de segurança para: ${url}`);
    
    /**
 * Motor de Inteligência Link Inspector
 * Responsável por dissecar a URL em múltiplas camadas de segurança.
 */
    const scanResult = await scanner.analyze(url);
    
    // 2. Aqui você integraria com o Supabase para salvar se necessário
    // const { data, error } = await supabase.from('nexus_scans').insert([{...}]);

    return {
      success: true,
      data: scanResult
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Falha interna no motor de análise' });
  }
});

// Health Check
fastify.get('/health', async () => {
  return { status: 'Link Inspector Engine Online', version: '1.0.0' };
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

import { registerAs } from '@nestjs/config';

interface MinIoServiceOptions {
    endPoint: string;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export const minioConfig = registerAs<MinIoServiceOptions>(
    'minio',
    (): MinIoServiceOptions => ({
        endPoint: 'cdn.nordicuniversity.org',
        useSSL: true,
        accessKey: 'VkZ8kGPGVAILcURlwI62',
        secretKey: 'rzxgnz300PDlJZKEyqM8mKqOWlJtZ9bmogp2qc6X',
        bucket: 'cloud',
    }),
);
/** @type {import('drizzle-kit').Config} */
module.exports = {
    schema: './server/drizzle/schema/autoRegister.js', // 👈 改成自动加载文件
    out: './server/drizzle/sql',
    dialect: 'sqlite',
    dbCredentials: {
        url: './server/drizzle/db.sqlite' // ✅ 实际路径
    }
}

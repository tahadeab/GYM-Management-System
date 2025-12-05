const Database = require('./database/improved_db');

async function testDatabase() {
    console.log('🧪 اختبار قاعدة البيانات...');
    
    try {
        // إنشاء مثيل من قاعدة البيانات
        const database = new Database();
        
        // انتظار تهيئة قاعدة البيانات
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
        
        // اختبار تسجيل الدخول
        console.log('\n🔐 اختبار تسجيل الدخول...');
        
        const result = await database.authenticateUser('admin', 'admin123');
        
        if (result) {
            console.log('✅ تسجيل الدخول ناجح!');
            console.log('المستخدم:', result.full_name);
            console.log('الصلاحية:', result.role);
        } else {
            console.log('❌ فشل في تسجيل الدخول');
        }
        
        // اختبار الإحصائيات
        console.log('\n📊 اختبار الإحصائيات...');
        
        const stats = await database.getDashboardStats();
        console.log('الإحصائيات:', stats);
        
        console.log('\n🎉 اكتمل اختبار قاعدة البيانات بنجاح!');
        
    } catch (error) {
        console.error('❌ خطأ في اختبار قاعدة البيانات:', error);
    }
}

testDatabase();


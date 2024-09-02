export default {
    magento2: {
        elasticsearch: {
            node: '<http://elasticsearch:9200>',
            /*auth: {
                username: 'elastic',
                password: 'changeme',
            }*/
        },
    },
    cron: {
        magento2_deployment: {
            when: '@build',
            what: [
                'magento2/admin_token_update.js',
                'magento2/category_index_update.js',
                'magento2/update_navigation.js',
                'magento2/deploy_caches.js',
            ],
        },
        magento2_publish: {
            when: '@publish',
            what: 'magento2/shop_symlink.js',
        },
        magento2_clear_caches: {
            when: '* * * * *', // At every minute.
            what: 'magento2/clear_caches.js',
        },
        magento2_admin_token_update: {
            when: '*/30 * * * *', // At every 30th minute.
            what: 'magento2/admin_token_update.js',
        },
        magento2_category_index_update: {
            when: '1 * * * *', // At minute 1.
            what: 'magento2/category_index_update.js',
        },
        magento2_navigation_update: {
            when: '2 * * * *', // At minute 2.
            what: 'magento2/update_navigation.js',
        },
    },
    _secrets: {
        magento2: {
            admin_user: '',
            admin_password: '',
        },
    },
};

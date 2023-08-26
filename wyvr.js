export default {
    magento2: {
        elasticsearch: {
            node: '<http://elasticsearch:9200>',
            /*auth: {
                username: 'elastic',
                password: 'changeme',
            }*/
        },
        marker: {
            dir: '<magento_root>/var',
        },
    },
    _secrets: {
        magento2: {
            admin_user: '',
            admin_password: '',
        },
    },
};

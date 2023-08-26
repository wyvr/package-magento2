export default {
    url: '/[store]/api/newsletter/subscribe/',
    _wyvr: () => {
        return {
            methods: ['post'],
        };
    },
    onExec: async () => {
        return {
            content: 'missing newsletter implementation'
        };
    },
};

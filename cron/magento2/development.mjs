import { update_navigation } from "@src/shop/navigation/update_navigation.mjs";

export default async function (context) {
    const result = await update_navigation();
}
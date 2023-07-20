module.exports = async function(array, promiseFunction, chunkSize = 10) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        const chunkResult = await Promise.all(chunk.map((item) => promiseFunction(item)));
        result.push(...chunkResult);
    }
    return result;
};

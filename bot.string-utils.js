
//Return substring with given length without cutting through a word
function getSubWords(sentence, maxLength){
    var trimmedString = sentence.substr(0, maxLength);
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
    return trimmedString;
}
module.exports.getSubWords = getSubWords;


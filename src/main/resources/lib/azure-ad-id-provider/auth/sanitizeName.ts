/**
 * sanitizeName module.
 * @module lib/azure-ad-id-provider/auth/sanitizeName
 */

// a-zA-Z\-_ ’'‘ÆÐƎƏƐƔĲŊŒẞÞǷȜæðǝəɛɣĳŋœĸſßþƿȝĄƁÇĐƊĘĦĮƘŁØƠŞȘŢȚŦŲƯY̨Ƴąɓçđɗęħįƙłøơşșţțŧųưy̨ƴÁÀÂÄǍĂĀÃÅǺĄÆǼǢƁĆĊĈČÇĎḌĐƊÐÉÈĖÊËĚĔĒĘẸƎƏƐĠĜǦĞĢƔáàâäǎăāãåǻąæǽǣɓćċĉčçďḍđɗðéèėêëěĕēęẹǝəɛġĝǧğģɣĤḤĦIÍÌİÎÏǏĬĪĨĮỊĲĴĶƘĹĻŁĽĿʼNŃN̈ŇÑŅŊÓÒÔÖǑŎŌÕŐỌØǾƠŒĥḥħıíìiîïǐĭīĩįịĳĵķƙĸĺļłľŀŉńn̈ňñņŋóòôöǒŏōõőọøǿơœŔŘŖŚŜŠŞȘṢẞŤŢṬŦÞÚÙÛÜǓŬŪŨŰŮŲỤƯẂẀŴẄǷÝỲŶŸȲỸƳŹŻŽẒŕřŗſśŝšşșṣßťţṭŧþúùûüǔŭūũűůųụưẃẁŵẅƿýỳŷÿȳỹƴźżžẓ
// ASCII !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
// -.0123456789abcdefghijklmnopqrstuvwxyz -> Allowed
// !"()’‘ƏƔĲŊǷȜəɣĳŋĸ is removed
// #$%&'*+,/:;<=>?@[\]^_`{|}~ -> -
// æÆ -> ae
// øØ -> o
// Œœ -> oe
// åÅ -> a
// Ðð -> d
// ƎƐǝɛ -> e
// ẞß -> ss
// Þ -> th
// ſ - l
// ABCDEFGHIJKLMNOPQRSTUVWXYZ -> abcdefghijklmnopqrstuvwxyz
// Anything else -> -
// -- -> -
// Starting "-" or "." is removed
/**
 * Removes and replaces characters that are illegal in a user or group name.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[!"()]+/g, "") // ASCII removed.
    .replace(/[#$%&'*+,/:;<=>?@[\\\]^_`{|}~\s]+/g, "-") // ASCII replaced.
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a") // Norwegian chars.
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "o") // Swedish chars.
    .replace(/--+/g, "-") // Two or more dashes becomes just one.
    .replace(/^[-.]+/, "") // Do not begin with - or .
    .replace(/[-.]+$/, ""); // Do not end in - or .
}

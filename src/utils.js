// The template lays text on a fixed 8px character grid, so every value it
// prints must have a known character count. pad() guarantees that width.
let pad = (value, width) => {

    let str = value.toString()
    return str.length >= width ? str.slice(0, width) : str + " ".repeat(width - str.length)
}

let align_username = (username) => {

    var len = username.length

    if (len <= 5) {
        return username + "@github.com"
    } else if (len <= 7) {
        return username + "@github"
    } else if (len <= 10) {
        return username + "@git"
    } else if (len > 16) {
        return username.slice(0, 17)
    } else {
        return username
    }

}


module.exports = { pad, align_username }

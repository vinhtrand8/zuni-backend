export type FieldString = Array<string>;
const MAX_VALUE_CHUNK = 4;
const NUM_CHAR_EACH_CHUNK = Math.floor(254 / 8);
const MAX_STRING_LENGTH = MAX_VALUE_CHUNK * NUM_CHAR_EACH_CHUNK;
const JSONStringify = require('json-stable-stringify');

function reverseString(str: string) {
  // Step 1. Use the split() method to return a new array
  const splitString = str.split(''); // var splitString = "hello".split("");
  // ["h", "e", "l", "l", "o"]

  // Step 2. Use the reverse() method to reverse the new created array
  const reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
  // ["o", "l", "l", "e", "h"]

  // Step 3. Use the join() method to join all elements of the array into a string
  const joinArray = reverseArray.join(''); // var joinArray = ["o", "l", "l", "e", "h"].join("");
  // "olleh"

  //Step 4. Return the reversed string
  return joinArray; // "olleh"
}

function intTo256BitNumber(value: number): FieldString {
  const result = [];
  for (let i = 0; i < MAX_VALUE_CHUNK - 1; ++i) result.push('0');
  result.push(value.toString());
  return result;
}

export function convertTo256BitNumber(value: any): FieldString {
  if (Number.isInteger(value)) {
    return intTo256BitNumber(value);
  }
  //
  let strValue: string = reverseString(JSONStringify(value));
  while (strValue.length < MAX_STRING_LENGTH) {
    strValue += '\0';
  }

  // fold => this raises error when the real value is >   MAX_STRING_LENGTH
  while (strValue.length > MAX_STRING_LENGTH) {
    const i: number = strValue.length - MAX_STRING_LENGTH - 1;
    const x = strValue[i].charCodeAt(0);
    const y = strValue[strValue.length - 1].charCodeAt(0);
    const z = x ^ y;
    strValue = String.fromCharCode(z) + strValue.slice(1, strValue.length - 1);
    // strValue[strValue.length - MAX_STRING_LENGTH]
  }
  strValue = reverseString(strValue);

  // convert this string into 248-bit chunks
  const result: FieldString = [];
  for (let i = 0; i < strValue.length; ++i) {
    const l = i,
      r = l + NUM_CHAR_EACH_CHUNK - 1;
    // convert strValue[l -> r] into a Field value
    let curVal = 0n;
    for (let j = l; j <= r; ++j) {
      curVal = curVal * 256n + BigInt(strValue.charCodeAt(j));
    }
    //
    result.push(curVal.toString());
    i = r;
  }
  return result;
}

export function compareFieldStrings(a: FieldString, b: FieldString): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) {
      return 1;
    } else if (a[i] < b[i]) {
      return -1;
    }
  }
  return 0;
}

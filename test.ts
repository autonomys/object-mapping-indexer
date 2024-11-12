import { cidFromBlakeHash, cidToString } from "@autonomys/auto-dag-data";

console.log(
  cidToString(
    cidFromBlakeHash(
      Buffer.from(
        "06a6bd21ac6d4fd940129616e2c475c68a68dfb88ed59897d645106d4a7ed199",
        "hex"
      )
    )
  )
);

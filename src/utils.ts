import { SitemapNode, SitemapSubNode, TrailingSlashMode } from "./types"
import fs from "fs"
import * as path from "path"

export const sitemapNodeToXML = (
  node: SitemapNode | SitemapSubNode,
  queryData: any
): string => {
  let xml = ""

  for (const tag in node) {
    if (tag === "type") continue //We do not write the "type" attribute which is used in SitemapManager
    const tagValue = node[tag]
    // Add support for passing in a parameter in the root node called serializeArray which is an array of subnode abjects.
    // This is to allow adding multiple subnodes with the same key, such as <image:image>, to the sitemap.
    if (tag === "serializeArray" && tagValue) {
      ;(tagValue as SitemapSubNode[]).forEach((obj: SitemapSubNode) => {
        let content = ""
        if (typeof obj === "object") {
          content = sitemapNodeToXML(obj, queryData)
          xml = `${xml}${content}`
        }
      })
    } else if (tag === "lastmodFunc" && typeof tagValue === "function") {
      // Add support for passing in a function to calculate the lastmod. The return value of the function will
      // act as the value for the lastmod tag
      let content = tagValue(queryData)
      xml = `${xml}<lastmod>${content}</lastmod>`
    } else {
      let content = ""
      if (typeof tagValue === "string") {
        content = encodeXML(tagValue as string)
      } else {
        content = sitemapNodeToXML(tagValue as SitemapSubNode, queryData)
      }
      xml = `${xml}<${tag}>${content}</${tag}>`
    }
  }

  return `${xml}`
}

export const writeXML = (xml: string, folderPath: string, filename: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  const filePath = path.join(folderPath, filename)
  fs.writeFileSync(filePath, xml)
}

export const msg = (msg: string) => `gatsby-plugin-complex-sitemaps - ${msg}`

export const joinURL = (
  trailingSlashMode: TrailingSlashMode,
  baseURL: string,
  ...parts: string[]
) => {
  //Remove start/end slash on parts
  parts = parts.map((part: string, index: number) =>
    index + 1 !== parts.length || trailingSlashMode != "auto"
      ? part.replace(/^\/*/, "").replace(/\/*$/, "")
      : part.replace(/^\/*/, "")
  )
  //Add / at the end of parts
  parts = parts.map((part: string) => `${part}`)

  //Remove end slash of baseURL
  baseURL = baseURL.replace(/\/*$/, "")

  //Return https://www.example.com/part1/part2/part3/
  return `${baseURL}/${parts.join("/")}${
    trailingSlashMode === "add" ? "/" : ""
  }`
}

const encodeXML = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

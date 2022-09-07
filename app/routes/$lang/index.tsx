import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebLinkModel, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import queryString from 'query-string'

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://facingmyfaces.davidegiovanni.com/it-it'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Homepage")
    description = page.description !== '' ? page.description : page.title !== '' ? page.title : "Illustrazioni di Davide Giovanni Steccanella"
    image = page.image !== '' ? page.image : ''
    url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname
  }

  return metadata(
    {
      title: title, 
      description: description, 
      image: image, 
      url: url, 
      robots: 'follow', 
      type: 'website',
    }
  )
};

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  logo: string;
  primary: string;
  secondary: string;
  feed: Feed;
  items: any[];
  navbar: WebLinkModel[];
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'it-IT'

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/facingmyfaces.davidegiovanni.com?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Error(`API website: ${websiteErr.message} ${websiteErr.code}`);
  }
  const logo = websiteRes.website.theme.logoUrl
  const primary = websiteRes.website.theme.primaryColor
  const secondary = websiteRes.website.theme.invertedPrimaryColor

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/facingmyfaces.davidegiovanni.com/pages/index?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API page: ${pageErr.message} ${pageErr.code}`);
  }

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/facing-my-faces/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes

  const items: FeedItem[] = feed.items

  let couples: any[] = []

  for (let index = 0; index < items.length; index+=2) {
    const item = items[index];
    const item2 = items[index + 1]

    let array: any[] = [item, item2]
    couples.push(array)

    array = []
  }

  let navbar = websiteRes.website.headerNav.links

  if (websiteRes.website.headerNav.primaryLink.url !== "") {
    navbar.push(websiteRes.website.headerNav.primaryLink)
  }

  if (websiteRes.website.headerNav.secondaryLink.url !== "") {
    navbar.push(websiteRes.website.headerNav.secondaryLink)
  }

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    primary,
    secondary,
    logo,
    feed,
    items: couples,
    navbar
  }

  return json(loaderData)
};

export default function Index() {
  const { i18n, sections, navbar, items, secondary } = useLoaderData<LoaderData>();
  const params = useParams()

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  function getLinkIcon (url: string): string {
    if (url.toLowerCase().includes('instagram')) {
      return 'instagram'
    }
    if (url.toLowerCase().includes('about')) {
      return 'about'
    }
    if (url.toLowerCase().includes('illos.davidegiovanni.com')) {
      return 'website'
    }
    if (url.toLowerCase().includes('add')) {
      return 'add'
    }
    if (url.toLowerCase().includes('face-of-the-day')) {
      return 'faceoftheday'
    }
    return 'default'
  }

  return (
    <div className="bg-white h-full w-full pb-12 pt-20 px-4 lg:p-12 flex flex-col overflow-y-auto">
      <h1 className="relative z-20 lg:hidden w-full text-center mb-4" style={{ fontSize: fluidType(48, 64, 300, 2400, 1.5).fontSize, lineHeight: fluidType(28, 32, 300, 2400, 1.5).lineHeight }}>
        {sections[0].title}
      </h1>
      <div className="relative z-20 font-sans mb-2 lg:mb-4 flex items-center justify-center lg:justify-between w-full">
        <div className="flex items-center flex-none">
        {
          navbar.slice(0, navbar.length / 2).map(n => (
            n.url.includes('https://facingmyfaces.davidegiovanni.com') ? 
            <Link to={n.url.replace('https://facingmyfaces.davidegiovanni.com', `/${params.lang}`)} className="flex-none group">
              <span className="sr-only">{ n.title }</span> <img className="w-16 h-16 group-hover:rotate-6" src={`/icons/${getLinkIcon(n.url)}.png`} alt="" />
            </Link> :
            <a href={n.url} className="flex-none group" target="_blank" rel="noopener"><span className="sr-only">{ n.title }</span> <img className="w-16 h-16 group-hover:-rotate-6" src={`/icons/${getLinkIcon(n.url)}.png`} alt="" /></a>
          ))
        }
        </div>
        <h1 className="hidden lg:block text-2xl lg:text-6xl w-full text-center">
          {sections[0].title}
        </h1>
        <div className="flex items-center lg:justify-end flex-none">
          {
            navbar.slice(navbar.length / 2).map(n => (
              n.url.includes('https://facingmyfaces.davidegiovanni.com') ? 
              <Link to={n.url.replace('https://facingmyfaces.davidegiovanni.com', `/${params.lang}`)} className="flex-none group">
                <span className="sr-only">{ n.title }</span> <img className="w-16 h-16 group-hover:rotate-6" src={`/icons/${getLinkIcon(n.url)}.png`} alt="" />
              </Link> :
              <a href={n.url} className="flex-none group" target="_blank" rel="noopener"><span className="sr-only">{ n.title }</span> <img className="w-16 h-16 group-hover:-rotate-6" src={`/icons/${getLinkIcon(n.url)}.png`} alt="" /></a>
            ))
          }
        </div>
      </div>
      <img src="/icons/divider-hr.png" className="w-full mb-6 lg:hidden relative z-50 pointer-events-none select-none" alt="" />
      <div className="h-full w-full grid grid-cols-2 lg:grid-cols-6 gap-8 auto-rows-min relative z-20 flex-1">
        {
          items.map(i => (
            <Link to={`/${params.lang}/faces/${getSlug(i[1].id)}`}>
            <div className="w-full aspect-square relative group">
              <div className="w-full h-full relative z-20 group-hover:opacity-0">
                <Attachment attachment={{
                  id: "",
                  mediaType: "image/",
                  url: i[1].image,
                  description: ""
                }} />
              </div>
              <div className="w-full h-full inset-0 absolute z-10 opacity-0 group-hover:opacity-100">
                <Attachment attachment={{
                  id: "",
                  mediaType: "image/",
                  url: i[0].image,
                  description: ""
                }} />
              </div>
            </div>
            </Link>
          ))
        }
        <div className="hover:bg-slate-100">
          <p className="sr-only">
            Add yours
          </p>
          <Link to={`/${params.lang}/add-yours`} className="flex items-center justify-center h-full w-full aspect-square hover:scale-125 transition ease-in-out delay-150 duration-200 mix-blend-multiply">
            <img className="w-20 h-20" src="/icons/add.png" alt="" />
          </Link>
        </div>
      </div>
      <img src={sections[0].image} alt="" className="absolute inset-0 w-full h-full" />
    </div>
  );
}
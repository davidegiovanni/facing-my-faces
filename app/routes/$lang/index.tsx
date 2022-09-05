import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
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

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    primary,
    secondary,
    logo,
    feed,
    items: couples
  }

  return json(loaderData)
};

export default function Index() {
  const { i18n, sections, feed, items, secondary } = useLoaderData<LoaderData>();
  const params = useParams()

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  return (
    <div className="bg-red-500 h-full w-full p-12 flex flex-col">
      <div className="relative z-20 font-sans mb-4">
        <h1 className="text-2xl lg:text-6xl w-full text-center">
          {sections[0].title}
        </h1>
      </div>
      <div className="h-full w-full grid grid-cols-6 gap-8 auto-rows-min relative z-20 overflow-y-auto flex-1">
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
      </div>
      <img src={sections[0].image} alt="" className="absolute inset-0 w-full h-full" />
    </div>
  );
}
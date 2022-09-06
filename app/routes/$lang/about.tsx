import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png'
  let url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname
  
  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "About")
    description = page.summary !== '' ? page.summary : page.title !== '' ? page.title : "Facing my faces"
    image = page.image !== '' ? page.image : "https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png"
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

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  canonical: string;
  item: FeedItem;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/about/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = 'the-project'
  let foundNews = feed.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundNews === undefined) {
    throw new Error("News undefined");
  }
  const item: FeedItem = foundNews

  const canonical = `https://facingmyfaces.davidegiovanni.com/${params.lang}/about`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem
  }

  return json(loaderData);
};

export default function About() {
  const { i18n, item, canonical } = useLoaderData<LoaderData>();
  const params = useParams()

    return (
      <div className="overflow-y-auto h-full w-full pt-16">
        <div className="absolute top-0 left-0 m-4 z-40 w-16 h-16 mix-blend-multiply">
          <Link to={`/${params.lang}`} className="underline">
            <p className="sr-only">
              Torna indietro
            </p>
            <img src="/icons/arrow.png" alt="" />
          </Link>
        </div>
        <div className="py-4 lg:py-16 px-4 mb-8 lg:mb-16 text-center">
          <div className="flex justify-start w-full lg:w-9/12 mx-auto mb-4 lg:mb-8">
            <div className="w-full">
              <h1 style={{ fontSize: fluidType(48, 64, 300, 2400, 1.5).fontSize, lineHeight: fluidType(28, 32, 300, 2400, 1.5).lineHeight }}>
                {item.title}
              </h1>
              {item.summary && <div className="w-full py-4 mt-2 lg:px-4">
                <h2 className="italic text-center" style={{ fontSize: fluidType(20, 24, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
                  {item.summary}
                </h2>
              </div>}
              <img src="/icons/divider-hr.png" className="w-full" alt="" />
            </div>
          </div>
          { item.content_html !== "" && item.content_html !== undefined &&
            <div className="w-full mx-auto mb-2">
              <article className="block prose max-w-none w-full mx-auto text-center text-black prose-a:text-blue-500 prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-purple-500 prose-li:marker:text-emerald-500 prose-img:w-full prose-img:h-full prose-p:text-invisible prose-p:text-[0.1px]">
                {parse(item.content_html)}
              </article>
            </div>
          }
        </div>
      </div>  
    )
}
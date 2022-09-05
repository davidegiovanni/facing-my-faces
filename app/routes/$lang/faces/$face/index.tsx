import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import queryString from 'query-string'

import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ArrowRightIcon, ViewGridAddIcon, ViewGridIcon, XIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "Page") + ' | Davide G. Steccanella'
    description = page.summary !== '' ? page.summary : page.title !== '' ? page.title : "Le illustrazioni di Davide G. Steccanella"
    image = page.image !== '' ? page.image : ""
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
  previous: string;
  current: number;
  next: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/facing-my-faces/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = params.face
  let foundFace = feed.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundFace === undefined) {
    throw new Error("Face undefined");
  }

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  let indexOfItem = feed.items.indexOf(foundFace)
  let nextItemIndex = (indexOfItem !== feed.items.length - 1 && indexOfItem % 2 !== 0) ? indexOfItem + 2 : -1
  let nextItemSlug = nextItemIndex !== -1 ? feed.items[nextItemIndex].id : ''
  let previousItemIndex = (indexOfItem > 0 && indexOfItem % 2 !== 0) ? indexOfItem - 2 : -1
  let previousItemSlug = previousItemIndex !== -1 ? feed.items[previousItemIndex].id : ''
  nextItemSlug = nextItemSlug !== '' ? getSlug(nextItemSlug) as string : ''
  previousItemSlug = previousItemSlug !== '' ? getSlug(previousItemSlug) as string : ''

  const item: FeedItem = foundFace

  const canonical = `https://facingmyfaces.davidegiovanni.com/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem,
    current: indexOfItem,
    next: nextItemSlug,
    previous: previousItemSlug
  }

  return json(loaderData);
};

export default function ItemPage() {
  const { item, current, next, previous } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto lg:overflow-y-hidden h-full w-full">
      <div className="aspect-square lg:aspect-auto flex items-center justify-center p-4 h-full">
        <div className="w-1/2 h-full max-w-screen-md mx-auto">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: item.image,
              description: item.title
            }}></Attachment>
        </div>
      </div>
      <div>
        <div>
          { item.title}
          { item.summary}
          { item.content_html !== "" && item.content_html !== undefined &&
            <div className="w-full lg:w-9/12 mx-auto mb-2 mr-auto flex flex-col items-end">
              <article className="block prose max-w-none lg:w-11/12 text-black prose-a:text-blue-500 prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-purple-500 prose-li:marker:text-emerald-500">
                {parse(item.content_html)}
              </article>
            </div>
          }
        </div>
        {
          previous !== '' ?
            <Link to={`/${params.lang}/faces/${previous}`}>
              <p className="sr-only">
                Precedente
              </p>
              <ArrowLeftIcon className="w-8 h-8" />
            </Link> :
            <div className="w-8 h-8"></div>
        }
        <Link to={`/${params.lang}/faces`}>
          <p className="sr-only">
            Torna indietro
          </p>
          <ViewGridIcon className="w-8 h-8" />
        </Link>
        {
          next !== '' ?
            <Link to={`/${params.lang}/faces/${next}`}>
              <p className="sr-only">
                Successivo
              </p>
              <ArrowRightIcon className="w-8 h-8" />
            </Link> :
            <div className="w-8 h-8"></div>
        }
      </div>
    </div>
  );
}
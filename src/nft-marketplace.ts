import { Address, BigInt, store, Bytes } from "@graphprotocol/graph-ts"
import {
  ItemBought as ItemBoughtEvent,
  ItemListed as ItemListedEvent,
  ItemRemoved as ItemRemovedEvent
} from "../generated/NFTMarketplace/NFTMarketplace"
import {ActiveItem, ItemBought, ItemListed, ItemRemoved, CollectionFound} from "../generated/schema"

export function handleItemListed(event: ItemListedEvent): void {
  let itemListed = ItemListed.load(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
  let activeItem = ActiveItem.load(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
  let collectionFound = CollectionFound.load(event.params.nftAddress_.toHexString())

  if(!collectionFound){
    collectionFound = new CollectionFound(event.params.nftAddress_.toHexString())
    collectionFound.createdAt = event.block.timestamp
    collectionFound.nftAddress = event.params.nftAddress_
    collectionFound.listedCount = BigInt.fromString("0")
    collectionFound.floorPrice = event.params.price_
    collectionFound.name = event.params.name_
    collectionFound.symbol = event.params.symbol_
    collectionFound.tokenURI = event.params.tokenURI_
  }
 
  if(!itemListed){
    itemListed = new ItemListed(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
    collectionFound.listedCount = collectionFound.listedCount.plus(BigInt.fromString("1"))
  }
  
  if(!activeItem){
    activeItem = new ActiveItem(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
  }
  
  
  itemListed.seller = event.params.seller_
  activeItem.seller = event.params.seller_

  itemListed.nftAddress = event.params.nftAddress_
  activeItem.nftAddress = event.params.nftAddress_

  itemListed.tokenId = event.params.tokenId_
  activeItem.tokenId = event.params.tokenId_

  itemListed.price = event.params.price_
  activeItem.price = event.params.price_

  itemListed.createdAt = event.block.timestamp
  activeItem.createdAt = event.block.timestamp

  itemListed.name = event.params.name_
  activeItem.name = event.params.name_

  itemListed.symbol = event.params.symbol_
  activeItem.symbol = event.params.symbol_

  itemListed.tokenURI = event.params.tokenURI_
  activeItem.tokenURI = event.params.tokenURI_

  if(event.params.price_.lt(collectionFound.floorPrice)){
    collectionFound.floorPrice = event.params.price_
  }

  itemListed.save()
  activeItem.save()
  collectionFound.save()
}

export function handleItemBought(event: ItemBoughtEvent): void {
  let itemBought = ItemBought.load(getIdFromParams(event.params.tokenId_, event.params.nftAddress_)) 
  let collectionFound = CollectionFound.load(event.params.nftAddress_.toHexString())

  if(!itemBought){
    itemBought = new ItemBought(getIdFromParams(event.params.tokenId_, event.params.nftAddress_)) 
  }
  
  itemBought.buyer = event.params.buyer_
  itemBought.nftAddress = event.params.nftAddress_
  itemBought.tokenId = event.params.tokenId_
  itemBought.createdAt = event.block.timestamp
  itemBought.price = event.params.price_

  collectionFound!.listedCount = collectionFound!.listedCount.minus(BigInt.fromString("1"))
  if(collectionFound!.listedCount.equals(BigInt.fromString("0"))){
    let id = event.params.nftAddress_.toHexString()
    store.remove("CollectionFound", id)
  }else{collectionFound!.save()}

  let id = getIdFromParams(event.params.tokenId_, event.params.nftAddress_)  
  store.remove("ActiveItem", id)
  
  itemBought.save()
}

export function handleItemRemoved(event: ItemRemovedEvent): void {
  let itemRemoved = ItemRemoved.load(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
  let collectionFound = CollectionFound.load(event.params.nftAddress_.toHexString())

  if(!itemRemoved){
    itemRemoved = new ItemRemoved(getIdFromParams(event.params.tokenId_, event.params.nftAddress_))
  }

  itemRemoved.seller = event.params.seller_
  itemRemoved.nftAddress = event.params.nftAddress_
  itemRemoved.tokenId = event.params.tokenId_

  collectionFound!.listedCount = collectionFound!.listedCount.minus(BigInt.fromString("1"))
  if(collectionFound!.listedCount.equals(BigInt.fromString("0"))){
    let id = event.params.nftAddress_.toHexString()
    store.remove("CollectionFound", id)
  }else{collectionFound!.save()}

  
  let id = getIdFromParams(event.params.tokenId_, event.params.nftAddress_)  
  store.remove("ActiveItem", id)

  itemRemoved.save()
}

function getIdFromParams(tokenId: BigInt, nftAddress: Address): string {
  
  return tokenId.toString() + nftAddress.toHexString()
  
}